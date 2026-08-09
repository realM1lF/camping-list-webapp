# Spec: Profilbild, Emoji-Flow, Dichte, Personenanzeige

Datum: 2026-08-09  
Status: Freigegeben (Nutzer: direkt umsetzen)

## Scope

1. Profilbild (Instant Storage) bei Setup + Profil-Einstellungen (Name + Bild)
2. Emoji-Picker aus „Neues Item“ entfernen; Tippen auf Emoji im Detail öffnet Picker (nur Ersteller)
3. „Bring ich mit“ optisch stärker als „Benötigt“
4. Außen-Padding der App ~70 % reduzieren
5. Im Detail: „Erstellt von“ + Zusager mit Name, Bild und Anzahl — kompakt

## Technik

- Instant `$files` + Link `profiles.avatar`
- Clientseitiges Resize vor Upload (max. ~512px, JPEG/WebP)
- `AvatarBadge` zeigt Bild oder Initialen-Fallback
