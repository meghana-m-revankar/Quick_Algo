import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import {
  Login,
  Otp,
  Main,
  Signup,
  ForgotPassword,
  BrokerResponse,
  PaymentSuccess,
  PaymentFailure,
  KycRegister,
} from "#pages/index";
import RouteArr from "./routeList";


const router = createBrowserRouter([
    {
      name: "Login",
      path: "/",
      key: "login",
      route: "/",
      element: <Login />,
    },
    { path: "/kyc-complete", element: <Navigate to="/kyc" replace /> },
    { path: "/kyc-failed", element: <Navigate to="/kyc" replace /> },
    {
      name: "Payment Success",
      path: "/payment-success",
      key: "payment-success",
      route: "/payment-success",
      element: <PaymentSuccess />,
    },
    {
      name: "Payment Failure",
      path: "/payment-failure",
      key: "payment-failure",
      route: "/payment-failure",
      element: <PaymentFailure />,
    },
    {
      name: "KYC",
      path: "/kyc",
      key: "kyc",
      route: "/kyc",
      element: <KycRegister />,
    },
    {
      name: "Otp",
      path: "/otp",
      key: "Otp",
      route: "/otp",
      element: <Otp />,
    },
    {
      name: "Signup",
      path: "/signup",
      key: "Signup",
      route: "/signup",
      element: <Signup />,
    },
    {
      name: "Forgot Password",
      path: "/forgot-password",
      key: "forgot-password",
      route: "/forgot-password",
      element: <ForgotPassword />,
    },
    {
      name: "Broker Response",
      path: "/BrokerResponse",
      key: "BrokerResponse",
      route: "/BrokerResponse",
      element: <BrokerResponse />,
    },
    {
      path: "/",
      element: <Main />,
      children: RouteArr,
    },
    {
      path: "*",
      element: <Login />,
    },
  ]); 

  const Routes = () => {


    return <RouterProvider router={router} />;
  };
  
  export default Routes;