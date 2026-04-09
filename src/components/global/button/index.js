import ScaleLoader from "react-spinners/ScaleLoader";
const ButtonLoader = (props) => {
    const { color,height } = props
    return (
      <div>
        <ScaleLoader color={color !== undefined ? color : "#fff"} loading={props.isloading} height={height !== undefined ? height : 14} />
      </div>
    );
  };
   
  export default ButtonLoader;