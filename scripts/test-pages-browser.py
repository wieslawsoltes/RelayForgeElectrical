"""Static Pages browser checks. Requires Playwright and its Chromium installation."""
import functools
import http.server
import json
import os
from pathlib import Path
import shutil
import tempfile
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
RESULTS = ROOT / 'test-results'
RESULTS.mkdir(exist_ok=True)

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

with tempfile.TemporaryDirectory() as directory:
    shutil.copytree(ROOT / 'dist-pages', Path(directory) / 'RelayForgeElectrical')
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=directory))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{server.server_port}/RelayForgeElectrical/'
    try:
        with sync_playwright() as p:
            launch = {'headless': True}
            if os.environ.get('CHROMIUM_EXECUTABLE'):
                launch['executable_path'] = os.environ['CHROMIUM_EXECUTABLE']
            browser = p.chromium.launch(**launch)
            context = browser.new_context(viewport={'width': 1440, 'height': 1000})
            errors, failed, requests = [], [], []
            def observe(page):
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.on('request', lambda request: requests.append(request.url))
                page.on('response', lambda response: failed.append(response.url) if response.status >= 400 else None)
            def ready(page):
                page.wait_for_function('window.relayforge && document.querySelector("#save-status").textContent === "Saved in this browser"')
            page = context.new_page(); observe(page); page.goto(url); ready(page)
            original_name = page.evaluate('window.relayforge.project.name')
            page.screenshot(path=str(RESULTS / 'pages-desktop.png'))
            tab = context.new_page(); observe(tab); tab.goto(url); ready(tab)
            page.get_by_role('button', name='Project', exact=True).click()
            page.get_by_role('button', name='Properties', exact=True).click()
            page.get_by_label('Project name', exact=True).fill('Browser smoke project')
            page.get_by_role('button', name='Apply', exact=True).click()
            ready(page)
            tab.wait_for_function('window.relayforge.project.name === "Browser smoke project"')
            page.reload(); ready(page)
            assert page.evaluate('window.relayforge.project.name') == 'Browser smoke project'
            page.get_by_role('button', name='Collaborate', exact=True).click()
            assert 'browser only' in page.locator('#dialog-body').inner_text()
            page.get_by_role('button', name='Close', exact=True).click()
            page.get_by_role('button', name='Project', exact=True).click()
            page.get_by_role('button', name='Revision history', exact=True).click()
            assert 'Revision 2' in page.locator('#dialog-body').inner_text()
            page.get_by_role('button', name='Close', exact=True).click()
            page.get_by_role('button', name='Reports', exact=True).click()
            with page.expect_download() as download:
                page.get_by_role('button', name='Project JSON', exact=True).click()
            saved = RESULTS / 'project-export.relayforge'
            download.value.save_as(str(saved))
            assert json.loads(saved.read_text())['name'] == 'Browser smoke project'
            # Direct /app/ bookmarks must share the same DB, not reach an absolute /api path.
            direct = context.new_page(); observe(direct); direct.goto(url + 'app/'); ready(direct)
            assert direct.evaluate('window.relayforge.project.name') == 'Browser smoke project'
            mobile_context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
            mobile = mobile_context.new_page(); observe(mobile); mobile.goto(url); ready(mobile)
            assert mobile.evaluate('window.relayforge.project.name') == original_name
            assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Page overflows mobile viewport'
            mobile.screenshot(path=str(RESULTS / 'pages-mobile.png'))
            component = context.new_page(); observe(component); component.goto(url + 'examples/index.html')
            component.get_by_role('button', name='Add a relay', exact=True).click()
            assert not errors, errors
            assert not failed, failed
            assert not any('/api/' in request for request in requests), 'Static demo made a backend request'
            report = {'browser': browser.version, 'viewport': [1440, 1000], 'mobileViewport': [390, 844],
                      'checks': ['bootstrap', 'project edit', 'IndexedDB persistence', 'reload', 'cross-tab broadcast',
                                 'local-only disclosure', 'revision history', 'JSON export', 'app bookmark',
                                 'isolated browser contexts', 'mobile viewport', 'standalone components'],
                      'uncaughtErrors': errors, 'failedRequests': failed, 'physicalGPUQualified': False}
            (RESULTS / 'browser-report.json').write_text(json.dumps(report, indent=2))
            print(json.dumps(report, indent=2))
            browser.close()
    finally:
        server.shutdown()
