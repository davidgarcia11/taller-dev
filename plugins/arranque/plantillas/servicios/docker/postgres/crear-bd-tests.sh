#!/bin/sh
# Crea la base de datos de tests junto a la de desarrollo, la primera vez que se inicia el volumen.
# Los tests usan siempre <POSTGRES_DB>_test; la base de desarrollo nunca se toca desde los tests.
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
CREATE DATABASE "${POSTGRES_DB}_test" OWNER "$POSTGRES_USER";
SQL
