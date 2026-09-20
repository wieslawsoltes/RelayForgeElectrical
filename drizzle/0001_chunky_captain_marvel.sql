CREATE TABLE `operations` (
	`project_id` text NOT NULL,
	`operation_id` text NOT NULL,
	`revision` integer NOT NULL,
	`payload_hash` text NOT NULL,
	`changes` text NOT NULL,
	`author` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`project_id`, `operation_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_operations_revision` ON `operations` (`project_id`,`revision`);--> statement-breakpoint
CREATE TABLE `tombstones` (
	`project_id` text NOT NULL,
	`object_key` text NOT NULL,
	`revision` integer NOT NULL,
	PRIMARY KEY(`project_id`, `object_key`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
