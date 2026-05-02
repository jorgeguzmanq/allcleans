#!/bin/bash

# Función para generar el número de versión basado en la fecha y hora actual
generate_version_number() {
  date +"%y%m%d%H%M" # Formato: AAMMDDHHMI (Año, Mes, Día, Hora, Minuto)
}

# Genera el nuevo número de versión
NEW_VERSION_NUMBER=$(generate_version_number)

# Construye la nueva versión
NEW_VERSION="v${NEW_VERSION_NUMBER}"

# Muestra la nueva versión
echo "Nueva versión: $NEW_VERSION"

# Solicita la descripción de los cambios
read -p "Ingrese una breve descripción de los cambios: " change_description

# Construye el mensaje de commit
commit_message="$NEW_VERSION: $change_description"

# Asegúrate de estar en la rama 'main'
git checkout main

# Crea o actualiza un archivo de versión
echo "$NEW_VERSION" >version.txt

# Agrega todos los cambios al área de preparación
git add .

# Realiza un nuevo commit con el mensaje que incluye la versión y la descripción
git commit -m "$commit_message"

# Sube los cambios al repositorio remoto
git push origin main

echo "Proceso completado. Versión $NEW_VERSION registrada y cambios subidos a main."
echo "Mensaje del commit: $commit_message"

# # Solicita el mensaje del commit al usuario
# read -p "Ingrese el mensaje del commit: " commit_message

# # Asegúrate de estar en la rama 'main'
# git checkout main

# # Agrega los cambios al área de preparación
# git add .

# # Realiza un nuevo commit con el mensaje ingresado
# git commit -m "$commit_message"

# # Sube los cambios al repositorio remoto
# git push origin main
