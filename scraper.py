import requests
import json
import os

API_KEY = "6bab83cff6316986913430df870674a0"

oeuvres = [
    {"query": "Vikings", "type": "tv", "diff": "facile", "model": "hache_ragnar", "answers": ["vikings", "viking"]},
    {"query": "Vikings: Valhalla", "type": "tv", "diff": "moyen", "model": "bouclier", "answers": ["vikings valhalla", "valhalla"]},
    {"query": "The Last Kingdom", "type": "tv", "diff": "facile", "model": "epee_uhtred", "answers": ["the last kingdom", "last kingdom"]},
    {"query": "The Northman", "type": "movie", "diff": "moyen", "model": "corne", "answers": ["the northman", "northman"]},
    {"query": "How to Train Your Dragon", "type": "movie", "diff": "facile", "model": "dragon", "answers": ["how to train your dragon", "dragons", "krokmou"]},
    {"query": "Thor", "type": "movie", "diff": "facile", "model": "mjolnir", "answers": ["thor", "marvel thor"]},
    {"query": "The 13th Warrior", "type": "movie", "diff": "difficile", "model": "armure", "answers": ["the 13th warrior", "le 13eme guerrier", "le treizieme guerrier"]}
]

resultats_pour_le_jeu = []

print(" Démarrage de la récupération des données...\n")

for oeuvre in oeuvres:
    print(f"Recherche de : {oeuvre['query']}")
    url = f"https://api.themoviedb.org/3/search/{oeuvre['type']}?query={oeuvre['query']}&api_key={API_KEY}&language=fr-FR"
    reponse = requests.get(url)

    if reponse.status_code == 200:
        donnees = reponse.json()
        if len(donnees['results']) > 0:
            item = donnees['results'][0]
            
            # Les séries utilisent "name", les films utilisent "title"
            titre = item.get('title') or item.get('name')
            date = item.get('release_date') or item.get('first_air_date')
            annee = int(date.split('-')[0]) if date else "Inconnue"
            
            objet_jeu = {
                "id": oeuvre['query'].lower().replace(" ", "_").replace(":", ""),
                "title": titre,
                "accepted_answers": oeuvre['answers'],
                "release_year": annee,
                "type": "Movie" if oeuvre['type'] == "movie" else "TV Show",
                "difficulty": oeuvre['diff'],
                "funFact": item.get('overview', "Pas de résumé.")[:150] + "...",
                "model3D_ref": oeuvre['model']
            }
            resultats_pour_le_jeu.append(objet_jeu)
            print("Ajouté avec succès")
        else:
            print("Introuvable")

# ---------------------------------------------------------
# L'ÉTAPE MAGIQUE : ON SAUVEGARDE DANS TON DOSSIER PUBLIC !
# ---------------------------------------------------------

chemin_fichier = "public/movies_data.json"

if not os.path.exists("public"):
    os.makedirs("public")

with open(chemin_fichier, "w", encoding="utf-8") as fichier_json:
    json.dump(resultats_pour_le_jeu, fichier_json, indent=4, ensure_ascii=False)

print(f"\n c'est bon ça marche")