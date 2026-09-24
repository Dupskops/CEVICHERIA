# test_conexion.py
from app.database import engine
from sqlalchemy import text

def probar_conexion():
    try:
        # Intentamos abrir una conexión usando el motor (engine) de database.py
        with engine.connect() as conexion:
            # Ejecutamos una consulta SQL básica
            resultado = conexion.execute(text("SELECT version();"))
            version = resultado.fetchone()

            print("✅ ¡Conexión exitosa a Supabase!")
            print(f"📌 Información de la base de datos: {version[0]}")
    except Exception as e:
        print("❌ Error al intentar conectar con la base de datos:")
        print(e)

if __name__ == "__main__":
    probar_conexion()