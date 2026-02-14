import { Router, Route } from "@solidjs/router";
import Layout from "./components/Layout.tsx";
import MCPManager from "./pages/MCPManager.tsx";
import Providers from "./pages/Providers.tsx";
import Skills from "./pages/Skills.tsx";
import Agents from "./pages/Agents.tsx";

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={MCPManager} />
      <Route path="/providers" component={Providers} />
      <Route path="/skills" component={Skills} />
      <Route path="/agents" component={Agents} />
    </Router>
  );
}
