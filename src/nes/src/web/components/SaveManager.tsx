import * as React from "react";

require("./SaveManager.css");

export default class SaveManager extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  public render() {
    return (
      <div>
        <div>
          <strong>Save, or load your game from disk.</strong>
        </div>
        <div className="load-state-container">
          <div className="field">
            <div className="control">
              <button type="button" className="button" id="btn-save">
                <i className="fas fa-file-download" /> 
                <span className="button-label">
                  Save
                </span>
              </button>
            </div>
          </div>
          <div className="field">
            <div className="control">
              <div className="file has-name">
                <label className="file-label">
                  <input
                    className="file-input"
                    id="save-file"
                    type="file"
                    name="files[]"
                  />
                  <span className="file-cta">
                    <span className="file-icon">
                      <i className="fas fa-upload" />
                    </span>
                    <span className="file-label">Choose a file...</span>
                  </span>
                  <span id="file-name" className="file-name">
                    No file chosen.
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div className="field">
            <div className="control">
              <button type="button" className="button is-link" id="btn-load">
                <i className="fas fa-upload" /> 
                <span className="button-label">
                  Load
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
