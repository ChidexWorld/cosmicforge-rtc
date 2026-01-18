//! Job Queues
//!
//! This module contains all job queue implementations.
//! Queues store jobs in the database for async processing by workers.
//!
//! ## Available Queues
//!
//! - `email` - Email delivery queue
//!
//! ## Adding a New Queue
//!
//! 1. Create migration for the jobs table
//! 2. Create model in `models/`
//! 3. Create queue file in this folder
//! 4. Export from this mod.rs
//!
//! See `/docs/EMAIL_QUEUE.md` for the email queue example.

pub mod email;

pub use email::EmailQueue;
