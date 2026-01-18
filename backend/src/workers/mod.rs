//! Background Workers
//!
//! This module contains all background workers that process async jobs.
//! Workers run in separate Tokio tasks and poll the database for work.
//!
//! ## Available Workers
//!
//! - `email` - Processes queued email jobs
//!
//! ## Adding a New Worker
//!
//! 1. Create a new file in this folder (e.g., `notification.rs`)
//! 2. Implement the worker with a `run()` method
//! 3. Export it from this mod.rs
//! 4. Start it in main.rs
//!
//! See `/docs/EMAIL_QUEUE.md` for the email worker example.

pub mod email;

pub use email::{spawn_email_worker, EmailWorker, EmailWorkerHandle};
