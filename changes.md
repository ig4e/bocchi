# v13.0.2

## Fixed
- Added workaround for cslol compatibility issues

# v13.0.1

## Added
- New CSLoL management tab in settings for advanced mod configuration
- Support for multiple skins per champion selection
- Auto-fix mod issues setting
- Cache management tools in settings (view size and clear cache)
- Duplicate skin prevention logic

## Improved
- Complete UI refresh with modern glassmorphism aesthetic
- Enhanced champion list with better grouping and romanized search
- Modernized skin browser with improved card designs and hover effects
- Systematic removal of `any` types for 100% TypeScript safety
- Improved IPC bridge with strict typing

# v13.0.0

## Fixed
- Replaced node-7z with 7z-wasm for 100% reliable cslol-manager extraction across all user environments
- Eliminated antivirus false-positive blocking issues during tool downloads
- Removed external binary dependencies (7zip-bin, node-7z) that required ASAR unpacking
- Fixed extraction timeout issues with self-extracting archives

## Technical Changes
- Migrated to pure JavaScript/WebAssembly solution for 7z extraction
- Simplified electron-builder configuration by removing ASAR unpacking requirements
- Improved error handling and logging for extraction failures
