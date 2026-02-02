# Windows Setup Guide for Rust Development

## ⚠️ Build Error Fix

You're encountering a linker error because Rust on Windows requires the Microsoft Visual C++ Build Tools.

## 🔧 Solution: Install Visual Studio Build Tools

### Method 1: Install via Visual Studio Installer (Recommended)

1. **Download Visual Studio Build Tools**:

   - Visit: https://visualstudio.microsoft.com/downloads/
   - Scroll down to "Tools for Visual Studio"
   - Download "Build Tools for Visual Studio 2022"

2. **Run the installer** and select:

   - ✅ **Desktop development with C++**
   - This includes:
     - MSVC v143 - VS 2022 C++ x64/x86 build tools
     - Windows 11 SDK
     - C++ CMake tools for Windows

3. **Install** (this may take 10-20 minutes)

4. **Restart your terminal** and try again:
   ```bash
   cargo build
   ```

### Method 2: Use GNU Toolchain (Alternative)

If you don't want to install Visual Studio Build Tools, you can use the GNU toolchain:

1. **Install MSYS2**:

   - Download from: https://www.msys2.org/
   - Install it

2. **Add the GNU target**:

   ```bash
   rustup target add x86_64-pc-windows-gnu
   ```

3. **Build with GNU target**:

   ```bash
   cargo build --target x86_64-pc-windows-gnu
   ```

4. **Set GNU as default** (optional):
   ```bash
   rustup default stable-x86_64-pc-windows-gnu
   ```

## ✅ Verify Installation

After installing the build tools, verify with:

```bash
# Check Rust toolchain
rustup show

# Try building
cargo build
```

## 🚀 Next Steps

Once the build tools are installed, you can:

1. Build the project: `cargo build`
2. Run the project: `cargo run`
3. Connect to your Aiven PostgreSQL database

The database connection is already configured in `.env` file!

## 📝 Database Connection Details

Your Aiven PostgreSQL database is configured:

- Host: pg-34cb94d8-cosmicforge-4394.j.aivencloud.com
- Port: 16954
- User: avnadmin
- Database: defaultdb
- SSL: Required

---

**Need help?** Check the Rust installation guide: https://www.rust-lang.org/tools/install
