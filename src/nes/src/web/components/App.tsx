import * as React from "react";
import { MainTitle } from "./Title";
import { ButtonMappingInfo } from "./ButtonMappingInfo";
import NesConsoleUi from "./NesConsoleUi";
import { uiGameOptions } from "../../constants";
import { Footer } from "./Footer";

export interface AppProps {
  wasmModule: any;
}

export interface AppState {
  buttonInfoMappingVisible: boolean;
}

export default class App extends React.PureComponent<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);

    this.state = {
      buttonInfoMappingVisible: false
    };
  }

  public render() {
    const { wasmModule } = this.props;
    const { buttonInfoMappingVisible } = this.state;
    return (
      <div>
        <MainTitle
          title={"NesThing"}
          subtitle={
            'For this demo, a few games are supported. Choose one from the list and press "Play".'
          }
        />
        <ButtonMappingInfo
          onToggle={this._onBUttonMappingInfoToggle.bind(this)}
          visible={buttonInfoMappingVisible}
        />
        <NesConsoleUi options={uiGameOptions} wasmModule={wasmModule} />
        <Footer />
      </div>
    );
  }

  private _onBUttonMappingInfoToggle() {
    this.setState({
      buttonInfoMappingVisible: !this.state.buttonInfoMappingVisible
    });
  }
}
