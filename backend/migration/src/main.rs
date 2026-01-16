use sea_orm_migration::prelude::*;

#[async_std::main]
async fn main() {
    // Load .env file from current or parent directory
    if dotenvy::dotenv().is_err() {
        // Try parent directory
        dotenvy::from_filename("../.env").ok();
    }
    
    // Verify DATABASE_URL is set
    if std::env::var("DATABASE_URL").is_err() {
        eprintln!("ERROR: DATABASE_URL environment variable is not set!");
        eprintln!("Please create a .env file with DATABASE_URL");
        std::process::exit(1);
    }
    
    cli::run_cli(migration::Migrator).await;
}
