mod base;
mod verification;
mod password_reset;
mod welcome;
mod notification;

pub use verification::verification_email;
pub use password_reset::password_reset_email;
pub use welcome::welcome_email;
pub use notification::notification_email;

/// Email template output containing HTML and plain text versions
pub struct EmailTemplate {
    pub html: String,
    pub text: String,
}
