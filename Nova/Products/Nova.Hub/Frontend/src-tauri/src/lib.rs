use tauri::{
    tray::TrayIconBuilder,
    Manager, WindowEvent,
};
use std::sync::Arc;

mod tray_icon;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Create main tray icon
      let _tray = TrayIconBuilder::with_id("main-tray")
          .tooltip("Nova Hub - Elite PC Optimizer")
          .icon(app.default_window_icon().unwrap().clone())
          .build(app)?;

      // Setup tray functionality
      tray_icon::setup_tray(app.handle())?;

      let main_window = app.get_webview_window("main").unwrap();
      let app_handle = Arc::new(app.handle().clone());

      main_window.on_window_event(move |event| {
          if let WindowEvent::CloseRequested { api, .. } = event {
              api.prevent_close();
              if let Some(window) = (*app_handle).get_webview_window("main") {
                  let _ = window.hide();
              }
          }
      });

      // TODO: Add deep link handling for nova:// protocol
      // For now, we'll handle this through command line arguments

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
