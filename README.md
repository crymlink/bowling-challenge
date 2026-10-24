# Bowling Score

Eine Angular-App, die aus manuell eingegebenen Würfen die Punktzahl eines Bowling-Spiels für einen
Spieler berechnet. Der Fokus liegt auf korrekten Regeln und einer einfachen, fehlertoleranten
Eingabe, nicht auf dem Design.

Die nächsten Schritte stehen in [AUSBLICK.md](AUSBLICK.md).

## Starten

Voraussetzung: Node.js (getestet mit v26) und npm.

```bash
npm install
npm start        # Entwicklungsserver auf http://localhost:4200
npm test         # Unit-Tests mit Vitest
npm run build    # Produktions-Build nach dist/
```

## Bedienung

- Anzahl der umgeworfenen Pins eingeben und mit **Roll** oder Enter bestätigen. Danach steht der
  Cursor wieder im Eingabefeld, sodass mehrere Würfe direkt hintereinander eingegeben werden können.
- Es sind nur Werte von 0 bis zur Anzahl der noch stehenden Pins erlaubt. Ungültige Eingaben werden
  mit einer Meldung abgelehnt.
- **Random** wirft eine zufällige, gültige Anzahl Pins, um schnell ein Spiel durchzuspielen.
- Über dem Eingabefeld steht, in welchem Frame und Wurf man sich befindet und wie viele Pins noch
  stehen.
- Das Spielblatt zeigt die Würfe in der üblichen Notation (`X` Strike, `/` Spare, `-` kein Pin),
  die laufende Summe pro Frame und die Gesamtpunktzahl. Frames, deren Bonus noch aussteht, bleiben
  leer, bis ihre Punktzahl feststeht.
- **New game** startet ein neues Spiel.

## Architektur

```
src/app/game/
├── domain/       Regeln und Modelle, reines TypeScript ohne Angular
├── data-access/  GameStore (NgRx Signal Store), hält nur die Liste der Würfe; Ort für spätere API-Anbindung
├── view/         Spielseite und GameViewService, verbinden Store und Komponenten
└── components/   Darstellende Komponenten: Eingabe, Spielblatt, Frame, Steuerung
```

**Die Würfe sind die einzige Quelle der Wahrheit.** Der Store speichert nur die umgeworfenen Pins
in der Reihenfolge der Würfe. Frames, Punktzahlen, laufende Summen, der nächste Wurf, die stehenden
Pins und das Spielende werden daraus über `computed()` abgeleitet. Dadurch kann der Zustand nie in
sich widersprüchlich werden, und Erweiterungen wie Speichern oder Rückgängig machen betreffen nur
dieses eine Array.

**Die Regeln sind frameworkfrei.** `domain/bowling.rules.ts` besteht aus reinen Funktionen ohne
Abhängigkeit zu Angular. Die Berechnung folgt direkt der Aufgabenbeschreibung: Strike = 10 + die
nächsten zwei Würfe, Spare = 10 + der nächste Wurf, offener Frame = Pins beider Würfe. Im 10. Frame
sind die nächsten Würfe einfach seine eigenen Bonuswürfe, daher braucht die Berechnung dafür keinen
Sonderfall. Ein Sonderfall für den 10. Frame wird nur beim Aufteilen der Würfe und beim Aufstellen
neuer Pins benötigt. Die Anzahl der Würfe und Bonuswürfe ist als benannte Konstante hinterlegt,
nicht als Zahl im Code.

**Validierung auf zwei Ebenen.** Das Formular (Signal Forms) prüft die Eingabe für den Nutzer und
zeigt Fehlermeldungen an. Der Store prüft jeden Wurf zusätzlich gegen die Regeln, damit auch andere
Aufrufer keinen ungültigen Zustand erzeugen können.

**Darstellung getrennt von Logik.** Die Komponenten bekommen ihre Daten über `input()` und melden
Aktionen über `output()`. Die Notation des Spielblatts (`X`, `/`, `-`) steckt im
`FrameNotationService`, nicht im Store, weil sie nur die Anzeige betrifft.

### Verwendete Technik

- Angular 22 mit Standalone-Komponenten, Signals und Lazy Loading der Spielseite
- `@ngrx/signals` für den Store
- Signal Forms (`@angular/forms/signals`) für die Eingabe
- Vitest mit Angulars TestBed für die Tests

## Tests

Die Regeln werden über ihr Verhalten getestet, nicht über ihre Implementierung
(`domain/bowling.rules.spec.ts`). Die Tests laufen über eine kleine Hilfsfunktion `play(...rolls)`,
sodass die Regeln umgebaut werden können, ohne die Tests anzupassen. Abgedeckt sind unter anderem:

- komplette Spiele: nur Fehlwürfe (0), nur Spares (150), perfektes Spiel (300) und verschiedene
  Varianten des 10ten Frames
- das Beispiel aus der Aufgabe (Spare in Frame 3 mit 5 Pins Bonus) als Teil eines vollständigen
  Spiels mit laufender Summe
- ausstehende Boni, die erlaubten Würfe nach Strike oder Spare im 10. Frame und das Spielende

Zusätzlich gibt es Tests für Store, View-Service, Eingabekomponente, Notation und Routing.

## Vorgehen

Die Commit-Historie zeigt die Schritte im Einzelnen. Grob war die Reihenfolge:

1. **Projekt aufsetzen:** Angular CLI, strikte Typprüfung, NgRx Signals.
2. **Domäne zuerst:** Modelle und Regeln als reine Funktionen, unabhängig von der Oberfläche.
3. **Store und Oberfläche:** Store mit den Würfen als einzigem Zustand, danach Eingabe, Spielblatt
   und Spielseite als kleine, einzeln verantwortliche Komponenten.
4. **Verhaltenstests für die Regeln**, anschließend Refactoring auf die eine gemeinsame
   Bewertungsregel für alle Frames, abgesichert durch diese Tests.
5. **Aufräumen:** Struktur vereinfacht, Tests für die restlichen Schichten ergänzt, gefundene
   Fehler behoben (z. B. Position des `X` auf dem Spielblatt, Zurücksetzen der Eingabe nach einem
   Wurf).
6. **Ausblick** mit den nächsten Schritten.

Eine Funktion zum Rückgängig machen des letzten Wurfs gab es zwischenzeitlich. Sie wurde wieder
entfernt und steht im Ausblick als Teil der Fehlerkorrektur bei den nächsten Schritten.
