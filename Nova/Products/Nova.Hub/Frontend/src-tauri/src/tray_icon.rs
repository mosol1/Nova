use tauri::menu::{Menu, MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconEvent};
use tauri::{AppHandle, Manager, Runtime};

/// Set up event listeners for the existing tray icon
pub fn setup_tray<R: Runtime>(app: &AppHandle<R>) -> Result<(), tauri::Error> {
    // Access the tray icon by ID
    let tray = match app.tray_by_id("main-tray") {
        Some(tray) => tray,
        None => {
            eprintln!(
                "Tray icon not found. Ensure the tray icon is configured in tauri.conf.json."
            );
            return Ok(());
        }
    };

    // Create the tray menu
    let menu = create_tray_menu(app)?;
    tray.set_menu(Some(menu))?;

    // Add event handlers to the existing tray icon
    tray.on_menu_event(move |app, event| match event.id().as_ref() {
        "show" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        "hide" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.hide();
            }
        }
        "quit" => {
            std::process::exit(0);
        }
        _ => {}
    });

    tray.on_tray_icon_event(move |tray, event| {
        let app = tray.app_handle();
        if let TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
        } = event
        {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    });

    Ok(())
}

/// Create the tray menu
fn create_tray_menu<R: Runtime>(app: &AppHandle<R>) -> Result<Menu<R>, tauri::Error> {
    let show = MenuItemBuilder::with_id("show", "Show Window").build(app)?;
    let hide = MenuItemBuilder::with_id("hide", "Hide Window").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    MenuBuilder::new(app).items(&[&show, &hide, &quit]).build()
}

/// Function to minimize the app to the tray (no longer a Tauri command)
pub fn minimize_to_tray(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?; // Minimize to tray by hiding the window
    }
    Ok(())
} 