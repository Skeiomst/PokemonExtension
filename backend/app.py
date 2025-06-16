from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app, origins=["https://pkmnmap4.web.app"])

POKEAPI_BASE = "https://pokeapi.co/api/v2"

@app.route("/api/pokemon")
def get_pokemon_info():
    name = request.args.get("name", "").lower()
    if not name:
        return jsonify({"error": "No name provided"}), 400

    try:
        # 1. Obtener datos básicos del Pokémon
        res = requests.get(f"{POKEAPI_BASE}/pokemon/{name}")
        if res.status_code != 200:
            return jsonify({"error": "Pokémon not found"}), 404
        pkmn_data = res.json()

        types = [t["type"]["name"] for t in pkmn_data["types"]]
        image_url = pkmn_data["sprites"]["other"]["official-artwork"]["front_default"]

        # 2. Inicializar sets
        weak = set()
        resistant = set()
        immune = set()

        for t in types:
            print(f"Processing type {t}")
            type_data = requests.get(f"{POKEAPI_BASE}/type/{t}").json()
            relations = type_data["damage_relations"]

            # Añadir tipos de los que recibe doble daño
            for dis in relations["double_damage_from"]:
                weak.add(dis["name"])

            # Añadir tipos de los que recibe mitad daño
            for dis in relations["half_damage_from"]:
                resistant.add(dis["name"])
            
            # Añadir tipos de los que no recibe daño
            for dis in relations["no_damage_from"]:
                immune.add(dis["name"])

            

        # 3. Evitar que haya tipos repetidos en ambas listas
        shared = weak & resistant
        weak -= shared
        weak -= immune
        resistant -= shared
        
        # print(f"Weak to: {weak}")
        # print(f"Resistant to: {resistant}")
        # print(f"Inmune to: {immune}")

        return jsonify({
            "name": name.capitalize(),
            "image": image_url,
            "type": ", ".join(t.capitalize() for t in types),
            "weak": sorted(weak),
            "resistant": sorted(resistant),
            "immune": sorted(immune)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
