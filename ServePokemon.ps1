# Activar el entorno virtual
& "env\Scripts\Activate.ps1"

# Cambiar al directorio backend
Set-Location -Path backend

# Ejecutar la aplicación
python app.py

# Pausar la consola
Read-Host -Prompt "Presiona Enter para continuar"