1. Historique de la solution Essensys

La société Valentinéa a été créée en 2010 par Nicolas Gille afin de proposer un système domotique clé en main pour les maisons individuelles. En 2011 l’entreprise lance Essensys, un système entièrement filaire conçu pour couvrir 92 % des maisons construites en France
([Source](https://www.filiere-3e.fr/2013/05/30/valentinea-devoile-essensys-une-solution-domotique-cle-en-main-totalement-inedite/#:~:text=Lyon%20le%2028%20mai%202013,il%20y%20a%20un%20an))
. L’objectif est de proposer un produit standard, simple à installer et ne nécessitant pas d’études spécifiques.

Le concept repose sur un tableau domotique intégré à la GTL (goulotte technique logement) qui regroupe l’ensemble des automatismes : éclairage, chauffage, volets roulants, arrosage, sécurité et suivi des consommations d’eau et d’énergie
[best-of-batiment.com](https://www.best-of-batiment.com/essensys-la-domotique-autrement-s3117.html)
. L’utilisateur pilote ces fonctions depuis un écran tactile mural placé à l’entrée de la maison. Des « scénarios » préprogrammés (par ex. Je sors, Je vais me coucher, Je pars en vacances) permettent de fermer tous les volets, d’éteindre les lumières, de couper l’alimentation des prises de sécurité, de baisser le chauffage et d’armer l’alarme en appuyant sur un seul bouton
([Source](https://www.filiere-3e.fr/2013/05/30/valentinea-devoile-essensys-une-solution-domotique-cle-en-main-totalement-inedite/#:~:text=Lyon%20le%2028%20mai%202013,il%20y%20a%20un%20an))
. Le système comprend des détecteurs de mouvements, d’ouverture de porte, de pluie, de fuites d’eau et une électrovanne d’irrigation
best-of-batiment.com


2. Évolution de Valentinéa et fin de la commercialisation d’Essensys

Au fil des années, Valentinéa a fait évoluer son offre. En 2016 l’entreprise lance un kit domotique pré‑assemblé utilisant des connecteurs Pieuvre’n Play ; l’installation se réalise en quelques jours sans compétence particulière
mon-instal-elec.com
. En 2019 Valentinéa élargit sa gamme avec Electrikit, un kit d’électricité traditionnelle prêt‑à‑poser basé sur les mêmes connecteurs
mon-instal-elec.com
. L’année suivante voit apparaître Ventikit (kit de ventilation) et en 2022 Plombikit (kit de plomberie)
mon-instal-elec.com
.

En 2021, pour plus de lisibilité auprès de ses clients, Valentinéa change de nom et devient mon‑instal‑elec.com
mon-instal-elec.com
. Dans une interview, Nicolas Gille explique que les kits pré‑assemblés rencontraient un tel succès que l’entreprise a arrêté de vendre le système Essensys seul pour se spécialiser dans les kits prêts‑à‑poser
installation-renovation-electrique.com
. Cette évolution et le changement de nom marquent la fin de la commercialisation du produit Essensys.

3. Fermeture du site essensys.fr

Le domaine essensys.fr (le site historique du produit) n’est plus accessible. Une tentative d’accès réalisée le 1 janvier 2024 renvoie une erreur 502 indiquant que le serveur ne répond plus, ce qui signifie que le site a été fermé ou mis hors ligne
screenshot
. Aucune annonce officielle ne précise la date exacte de cette fermeture, mais la transformation de Valentinéa en mon‑instal‑elec.com en 2021 et l’arrêt de la commercialisation d’Essensys laissent penser que le site a été abandonné au cours des années suivantes.

4. Projet open‑source de la communauté Essensys

Après la fermeture d’Essensys, une communauté de passionnés a entrepris de libérer le code source du système avec l’accord du gérant de Valentinéa. Le code est diffusé sous licence MIT pour permettre une utilisation et une modification libres
raw.githubusercontent.com
. Plusieurs projets sont disponibles :

Installation Essensys sur Raspberry Pi – Le dépôt essensys-raspberry-install propose des scripts permettant de déployer l’architecture Essensys sur un Raspberry Pi 4. Le backend est écrit en Go et le frontend en React ; un serveur Nginx sert l’interface web et fait suivre les requêtes API au backend. Une configuration optionnelle avec Traefik gère l’accès local et distant via HTTPS. Le dépôt fournit un script d’installation (install.sh) qui compile le backend, construit le frontend et configure les services système
raw.githubusercontent.com
. Cette solution assure la compatibilité avec l’ancien client Essensys et permet d’auto‑héberger le service à domicile
raw.githubusercontent.com
.

Application iOS – Le projet essensys‑ios‑phone‑apps est une application native permettant de contrôler Essensys depuis un iPhone. Elle propose un tableau de bord avec des scènes (« Wake », « Evening », « Night », « Departure ») et un résumé de connexion, la gestion des lumières (allumage/extinction groupée, actions rapides, réorganisation des pièces), le contrôle des volets et un mode de connexion local (Wi‑Fi) ou distant avec authentification
raw.githubusercontent.com
.

Application Android – Le dépôt essensys‑android‑phone‑apps contient l’application Android officielle. Développée en Kotlin avec Jetpack Compose, elle permet de commander l’éclairage, les volets et des scénarios (Départ, Arrivée, Nuit) aussi bien en local qu’à distance. L’application offre un mode de connexion local via Wi‑Fi et un mode WAN avec authentification, et intègre des scénarios pour exécuter des actions combinées
raw.githubusercontent.com
.

Ces projets perpétuent l’esprit d’Essensys en offrant une alternative open‑source et communautaire. Ils permettent aux anciens utilisateurs de conserver leur installation et aux nouveaux passionnés de domotique d’expérimenter une solution filaire et auto‑hébergeable.

5. Licence et contributions

Les dépôts mentionnés utilisent la licence MIT, ce qui autorise la libre utilisation, la modification et la distribution du code, à condition de conserver l’avis de copyright et la licence d’origine
raw.githubusercontent.com
. Cette licence encourage la participation communautaire et facilite la reprise du projet par des bénévoles. Les contributeurs peuvent proposer des améliorations, corriger des bugs et adapter le système à d’autres matériels (par exemple d’autres micro‑ordinateurs que le Raspberry Pi).

Conclusion

Essensys a marqué le marché français de la domotique en proposant dès 2011 un système filaire abordable, prêt à poser et axé sur l’essentiel : gestion des éclairages, volets, chauffage, sécurité et consommation d’énergie. La société Valentinéa a ensuite évolué vers des kits d’installation complets et a abandonné la commercialisation du produit Essensys, aboutissant à la fermeture du site essensys.fr. Grâce à la mise à disposition du code source sous licence MIT et aux projets open‑source pour Raspberry Pi, iOS et Android, l’esprit d’Essensys perdure aujourd’hui dans une communauté qui continue de développer et d’améliorer cette solution domotique.