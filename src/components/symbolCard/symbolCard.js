import { IconRegistry } from '#components';
import React from "react";
import { HiOutlineChevronDoubleUp } from "react-icons/hi2";
import { HiOutlineChevronDoubleDown } from "react-icons/hi2";
import "./symbolCard.scss"
import { images } from "#helpers";

const SymbolCard = (props) => {
  const { symbolValue, symbolName } = props;
  return (
    <div className="col-12 col-lg-4 symbol_card">
      <div className="box box-body pull-up">
        <div className="media justify-content-between p-0">
          {/* <div className="text-left">
            <img src={images[`symbols/${symbolName}.png`]} alt={symbolName} width={75}/>
          </div> */}
          <div className="m-0">
            <h2 className="no-margin box_upper_text text-fade">{symbolName}</h2>
          </div>
          <div className="align-items-center flexbox fs-18 fw-500 mt-5">
          <div className="m-0">
            <p className="no-margin">
              <span
                className={`${
                  symbolValue?.priceChange < 0
                    ? "text-danger"
                    : "text-success"
                }`}
              >
                {symbolValue?.priceChange < 0 ? (
                  <IconRegistry name="chevron-double-down" size={20} />
                ) : (
                  <IconRegistry name="chevron-double-up" size={20} />
                )}
              </span>{" "}
              <span
                className={`${
                  symbolValue?.priceChange < 0
                    ? "text-danger"
                    : "text-success"
                }`}
              >
                {symbolValue?.lastTradePrice}
              </span>
            </p>
          </div>
          <div className="text-end">
            <p className="no-margin">
              <span
                className={`${
                  symbolValue?.priceChange < 0
                    ? "text-danger"
                    : "text-success"
                }`}
              >
                {symbolValue?.priceChange}
              </span>
            </p>
          </div>
        </div>
        </div>
        
      </div>
    </div>
  );
};

export default SymbolCard;
