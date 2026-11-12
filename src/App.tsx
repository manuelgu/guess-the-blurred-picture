import { DeckEditor } from "./pages/DeckEditor";
import { Display } from "./pages/Display";
import { Home } from "./pages/Home";
import { Host } from "./pages/Host";
import { JoinForm, Player } from "./pages/Player";
import { Centered } from "./components";
import { useI18n } from "./i18n";
import { usePath } from "./router";

export function App() {
  const path = usePath();
  const { t } = useI18n();
  const [, section, param] = path.split("/");
  const code = (param ?? "").toUpperCase();

  switch (section) {
    case "":
      return <Home />;
    case "decks":
      return param ? <DeckEditor key={param} id={param} /> : <Home />;
    case "tv":
      return <Display key={code} code={code} />;
    case "host":
      return <Host key={code} code={code} />;
    case "join":
      return code.length === 4 ? (
        <Player key={code} code={code} />
      ) : (
        <div className="phone">
          <Centered>
            <h2>{t("joinGame")}</h2>
            <JoinForm />
          </Centered>
        </div>
      );
    default:
      return <Home />;
  }
}
