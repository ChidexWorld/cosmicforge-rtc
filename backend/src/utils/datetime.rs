//! DateTime conversion utilities
//!
//! Helper functions for converting between chrono's DateTime<Utc> and NaiveDateTime.
//! Used for database storage (naive) and API responses (UTC).

use chrono::{DateTime, NaiveDateTime, Utc};

/// Convert NaiveDateTime to DateTime<Utc>
/// 
/// Interprets the naive datetime as being in UTC timezone.
/// Used when reading from database and converting to API response.
/// 
/// # Example
/// ```ignore
/// let naive = NaiveDateTime::from_timestamp(1234567890, 0);
/// let utc = naive_to_utc(naive);
/// ```
pub fn naive_to_utc(dt: NaiveDateTime) -> DateTime<Utc> {
    DateTime::from_naive_utc_and_offset(dt, Utc)
}

/// Convert DateTime<Utc> to NaiveDateTime
/// 
/// Strips timezone information, keeping the UTC time value.
/// Used when storing datetime in database as naive datetime.
/// 
/// # Example
/// ```ignore
/// let utc = Utc::now();
/// let naive = utc_to_naive(utc);
/// ```
pub fn utc_to_naive(dt: DateTime<Utc>) -> NaiveDateTime {
    dt.naive_utc()
}
