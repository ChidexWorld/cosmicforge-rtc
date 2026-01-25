//! DateTime utilities
//!
//! Simple passthrough - no timezone conversions.
//! Input "2026-01-25T14:00:00" outputs "2026-01-25T14:00:00".

use chrono::{DateTime, NaiveDateTime, Utc};

/// Get current time as NaiveDateTime (local system time)
pub fn now_naive() -> NaiveDateTime {
    Utc::now().naive_utc()
}

/// Convert NaiveDateTime to DateTime<Utc> - direct passthrough
/// The naive datetime value is kept exactly as-is
pub fn naive_to_utc(dt: NaiveDateTime) -> DateTime<Utc> {
    DateTime::from_naive_utc_and_offset(dt, Utc)
}

/// Convert DateTime<Utc> to NaiveDateTime - direct passthrough
/// The datetime value is kept exactly as-is
pub fn utc_to_naive(dt: DateTime<Utc>) -> NaiveDateTime {
    dt.naive_utc()
}

/// Parse input DateTime to NaiveDateTime - direct passthrough
pub fn input_to_naive(dt: DateTime<Utc>) -> NaiveDateTime {
    dt.naive_utc()
}
