; -------------------------------------------------------------
; TeleCloud Custom NSIS Installer Configuration
; Step-by-Step Wizard Flow:
; 1. Welcome Page
; 2. Install Path (Directory Selection)
; 3. Terms & Conditions
; 4. Installation (Progress bar)
; 5. Complete Installation (Run & Desktop Shortcut checkboxes)
; -------------------------------------------------------------

!macro customWelcomePage
  !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

!macro customPageAfterChangeDir
  !insertmacro MUI_PAGE_LICENSE "${BUILD_RESOURCES_DIR}\TERMS.txt"
!macroend

!ifndef BUILD_UNINSTALLER
  !ifndef DO_NOT_CREATE_DESKTOP_SHORTCUT
    !define DO_NOT_CREATE_DESKTOP_SHORTCUT
  !endif

  Function CreateDesktopShortcutFunc
    CreateShortCut "$DESKTOP\TeleCloud.lnk" "$INSTDIR\TeleCloud.exe" "" "$INSTDIR\TeleCloud.exe" 0 "" "" "TeleCloud - Your Private Telegram Cloud Drive"
    System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
  FunctionEnd

  !define MUI_FINISHPAGE_RUN_TEXT "Run ${PRODUCT_NAME}"
  !define MUI_FINISHPAGE_SHOWREADME
  !define MUI_FINISHPAGE_SHOWREADME_TEXT "Create Desktop Shortcut"
  !define MUI_FINISHPAGE_SHOWREADME_FUNCTION "CreateDesktopShortcutFunc"
!endif

!macro customUnInstall
  Delete "$DESKTOP\TeleCloud.lnk"
!macroend
