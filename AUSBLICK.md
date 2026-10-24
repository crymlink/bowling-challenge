# Ausblick – nächste Schritte

Der aktuelle Stand erfüllt die Aufgabe: Würfe werden einzeln eingegeben, validiert und zu einem
vollständigen Spiel mit Frame-Punkten und Gesamtpunktzahl ausgewertet. Die folgenden Punkte würde
ich als Nächstes angehen, grob nach Priorität sortiert.

## 1. Usability der Eingabe

- **Pin-Buttons statt Zahlenfeld:** Eine Reihe Buttons `0` bis `10`, bei der nur die noch möglichen
  Werte aktiv sind. Ein Klick pro Wurf ist schneller als Tippen und Bestätigen, gerade auf dem Handy. (UI kann erheblich verbessert/verschönert werden)
- **Tastenkürzel:** `X` für Strike, `/` für Spare, Ziffern für die Pins und Enter zum Bestätigen.
  So entspricht die Eingabe der Notation auf dem Spielblatt.
- **Korrektur von Fehleingaben:** Letzten Wurf rückgängig machen oder einen beliebigen Wurf auf dem
  Spielblatt anklicken und ändern. Da der Store nur die Liste der Würfe speichert und alles andere
  daraus abgeleitet wird, ist das technisch einfach. Die Regeln müssten beim Ändern eines früheren
  Wurfs allerdings prüfen, ob die nachfolgenden Würfe noch gültig sind.
- **Vorschau der maximal möglichen Punktzahl:** Zusätzlich zum aktuellen Stand anzeigen, wie viele
  Punkte im besten Fall noch erreichbar sind.

## 2. Spiel speichern

- **Lokale Persistenz:** Die Würfe im `localStorage` ablegen, damit ein Neuladen der Seite das Spiel
  nicht verwirft. Weil der Zustand nur aus einem Array von Zahlen besteht, reicht das Speichern und
  Wiederherstellen dieses Arrays. Ich würde hierfür wahrscheinlich ein Signal Store Feature bauen. (Wiederverwendbar)
- **Spielhistorie und Statistiken:** Abgeschlossene Spiele speichern und z. B. Durchschnitt,
  Bestleistung sowie Strike- und Spare-Quote anzeigen.

## 3. Mehrere Spieler

- Die Aufgabe verlangt einen Spieler, im echten Einsatz spielen aber meist mehrere auf einer Bahn.
  Dafür würde der Store eine Liste von Spielern mit je eigener Wurfliste und einen Zeiger auf den
  aktiven Spieler halten. Die Regeln in `bowling.rules.ts` bleiben unverändert, sie werden einfach
  pro Spieler angewendet.

## 4. Backend

- Die Spielregeln sind bewusst frameworkfrei und rein funktional geschrieben. Sie lassen sich
  unverändert in einem Node-Backend (z. B. NestJS) wiederverwenden, um Spiele serverseitig zu
  validieren und zu speichern, etwa für Ranglisten oder Ligen.
- Eine gemeinsame Bibliothek für Frontend und Backend (z. B. in einem Nx-Monorepo) würde
  sicherstellen, dass beide Seiten exakt dieselben Regeln verwenden.

## 5. Qualitätssicherung und Betrieb

- **End-to-End-Tests** mit Playwright für die wichtigsten Abläufe: perfektes Spiel (300 Punkte),
  nur Spares, nur Fehlwürfe, Bonuswürfe im 10. Frame und Neustart.
- **CI-Pipeline** mit GitHub Actions, die bei jedem Push Lint, Tests und Build ausführt.
- **Deployment** der App als statische Seite (z. B. GitHub Pages), damit sie ohne lokales Setup
  ausprobiert werden kann.
