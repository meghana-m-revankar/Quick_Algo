import React from "react";
import "./docs.scss";

const Docs = () => {
  return (
    <section className="content docs-page">
      <div className="card-box">
        <form>
        <div className="input-flex">
          <label className="label-style">API KEY</label>
          <div className="btn-flex">
            <input
              className="form-control text-input"
              type="text"
              placeholder=""
            ></input>
            <div>
              <button className="submit-btn">Re-Generate</button>
            </div>
          </div>
        </div>

        <div className="input-group-flex mt-3">
          <div className="input-flex">
            <label className="label-style">Strategy</label>
            <select className="form-control text-input" type="text">
              <option value="text"></option>
              <option value="text">Strategy</option>
            </select>
          </div>
          <div className="input-flex">
            <label className="label-style">Category</label>
            <select className="form-control text-input" type="text">
              <option value="text"></option>
              <option value="text">Category</option>
            </select>
          </div>
          <div className="input-flex">
            <label className="label-style">Identifier Name</label>
            <select className="form-control text-input" type="text">
              <option value="text"></option>
              <option value="text">Identifier Name</option>
            </select>
          </div>
        </div>
        <div className="input-flex mt-3">
          <label className="label-style">Platform Name</label>
          <div className="btn-flex">
            <select className="form-control text-input" type="text">
              <option value="text"></option>
              <option value="text">Platform Name</option>
            </select>
            <div>
              <button className="submit-btn">Script</button>
            </div>
          </div>
        </div>
        </form>
      </div>
    </section>
  );
};

export default Docs;
