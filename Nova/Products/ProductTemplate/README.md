# Nova Product Template

This is a template for creating new Nova products with a React + Tauri frontend and C# backend.

## Structure

```
ProductTemplate/
├── Frontend/           # React + Tauri application
│   ├── src/           # React components and TypeScript code
│   ├── src-tauri/     # Tauri configuration and Rust code
│   ├── package.json   # Frontend dependencies
│   └── index.html     # Main HTML file
└── Backend/           # C# backend service
    ├── Program.cs     # Main program entry point
    ├── ProductService.cs      # Main business logic service
    ├── ProductWorker.cs       # Background worker for periodic tasks
    ├── appsettings.json       # Configuration
    └── Nova.Product.Template.csproj  # Project file
```

## Getting Started

### Prerequisites

1. .NET 8.0 SDK
2. Node.js 18+ and npm
3. Rust and Tauri CLI
4. Visual Studio or VS Code

### Creating a New Product

1. **Copy the template**:
   ```bash
   cp -r ProductTemplate/ YourProductName/
   ```

2. **Rename files and update references**:
   - Rename `Nova.Product.Template.csproj` to `Nova.YourProductName.csproj`
   - Update namespace in all C# files from `Nova.Product.Template` to `Nova.YourProductName`
   - Update `package.json` name and description
   - Update `tauri.conf.json` productName and identifier

3. **Update configuration**:
   - Modify `appsettings.json` with your product details
   - Update `ProductService.cs` to implement your product logic
   - Customize the React frontend in `Frontend/src/`

4. **Add to solution**:
   - Add your new backend project to `Nova.sln`
   - Update build scripts to include your product

### Development

#### Backend
```bash
cd Backend
dotnet run
```

#### Frontend
```bash
cd Frontend
npm install
npm run tauri:dev
```

### Building

#### Backend
```bash
cd Backend
dotnet build --configuration Release
```

#### Frontend
```bash
cd Frontend
npm install
npm run tauri:build
```

## Integration with Nova Core

This template automatically integrates with Nova Core:

- **ProductService**: Registers with Nova Core and appears in Nova Hub
- **Communication**: Uses Nova's IPC system for backend communication
- **Authentication**: Inherits user authentication from Nova Core
- **Logging**: Uses Nova's centralized logging system
- **Configuration**: Follows Nova's configuration patterns

## Customization

### Backend Service
- Override `InitializeProductComponents()` for startup logic
- Override `CleanupProductComponents()` for cleanup logic
- Override `PerformPeriodicTasks()` in ProductWorker for background tasks
- Update product metadata methods (`GetProductId()`, `GetProductName()`, etc.)

### Frontend
- Customize React components in `src/`
- Update Tauri configuration in `src-tauri/tauri.conf.json`
- Add new dependencies to `package.json`
- Implement Nova backend communication in your components

## Nova Core Integration Points

1. **Product Registration**: Automatically registers with Nova Core
2. **IPC Communication**: Uses Nova's named pipe communication
3. **User Management**: Accesses current user from Nova Core
4. **Lifecycle Management**: Integrates with Nova's product lifecycle
5. **Logging**: Uses Nova's centralized logging system 