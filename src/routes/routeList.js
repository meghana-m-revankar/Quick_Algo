import React, { lazy, Suspense } from "react";
import { PageSkeleton } from "#components";


// Lazy load all page components with prefetch hints for faster loading
const Dashboard = lazy(() => import("#pages/dashboard/index"));
const OptionChain = lazy(() => import("#pages/optionChain/index"));
const TradeOption = lazy(() => import("#pages/tradeOption/index"));
const GainerLooser = lazy(() => import("#pages/gainerLooser/index"));
const Broker = lazy(() => import("#pages/broker/index"));
const BrokerSetup = lazy(() => import("#pages/brokerSetup/index"));
const Logs = lazy(() => import("#pages/logs/index"));
const Algo = lazy(() => import("#pages/algo/index"));
const ApiDocs = lazy(() => import("#pages/apiDocs/index"));
const Order = lazy(() => import("#pages/order/index"));
const Chart = lazy(() => import("#pages/chart/index"));
const Notification = lazy(() => import("#pages/notification/index"));
const Profile = lazy(() => import("#pages/profile/index"));
const BackTest = lazy(() => import("#pages/backtest/index"));
const Scalping = lazy(() => import("#pages/scalping/index"));
const AlgoTrading = lazy(() => import("#pages/algotrading/index"));
const Faq = lazy(() => import("#pages/faq/index"));
const StrategyDescription = lazy(() => import("#pages/strategyDescription/index"));
const CreateStrategy = lazy(() => import("#pages/createStrategy/index"));
const News = lazy(() => import("#pages/news/index"));
const NewsDetail = lazy(() => import("#pages/news/NewsDetail.jsx"));
const LearningCenter = lazy(() => import("#pages/learningCenter/index"));
const Plans = lazy(() => import("#pages/serviceCost/index"));
const StrategyList = lazy(() => import("#pages/strategyList/index"));
const StrategyBacktest = lazy(() => import("#pages/strategyBacktest/index"));
const PaymentSuccess = lazy(() => import("#pages/paymentSuccess/index"));
const PaymentFailure = lazy(() => import("#pages/paymentFailure/index"));
const PaymentHistory = lazy(() => import("#pages/paymentHistory/index"));
const Checkout = lazy(() => import("#pages/checkout/index"));
const KycList = lazy(() => import("#pages/kycList/index"));

// Fast loading component - shows skeleton immediately
const PageLoader = ({ type = "default" }) => (
  <div style={{ 
    minHeight: '100vh',
    background: 'var(--bg-color, #f8f9fa)'
  }}>
    <PageSkeleton type={type} />
  </div>
);

// Wrapper component for lazy-loaded routes
const LazyRoute = ({ component: Component }) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

const RouteArr = [
  {
    name: "Dashboard",
    path: "/dashboard",
    key: "dashboard",
    route: "/dashboard",
    element: <LazyRoute component={Dashboard} />,
  },
  {
    name: "Option Chain",
    path: "/option-chain",
    key: "option-chain",
    route: "/option-chain",
    element: <LazyRoute component={OptionChain} />,
  },
  {
    name: "Trade Optios",
    path: "/trade-option",
    key: "trade-option",
    route: "/trade-option",
    element: <LazyRoute component={TradeOption} />,
  },
  {
    name: "Top Gainer Looser",
    path: "/gainer-looser",
    key: "gainer-looser",
    route: "/gainer-looser",
    element: <LazyRoute component={GainerLooser} />,
  },
  {
    name: "Broker",
    path: "/broker",
    key: "broker",
    route: "/broker",
    element: <LazyRoute component={Broker} />,
  },
  {
    name: "Broker Setup",
    path: "/setup",
    key: "setup",
    route: "/setup",
    element: <LazyRoute component={BrokerSetup} />,
  },
  {
    name: "Pending Order",
    path: "/order/pending",
    key: "order/pending",
    route: "/order/pending",
    element: <LazyRoute component={Order} />,
  },
  {
    name: "Active Order",
    path: "/order/active",
    key: "order/active",
    route: "/order/active",
    element: <LazyRoute component={Order} />,
  },
  {
    name: "Closed Order",
    path: "/order/closed",
    key: "order/closed",
    route: "/order/closed",
    element: <LazyRoute component={Order} />,
  },
  {
    name: "Rejected Order",
    path: "/order/rejected",
    key: "order/rejected",
    route: "/order/rejected",
    element: <LazyRoute component={Order} />,
  },
  {
    name: "Logs",
    path: "/logs/:status",
    key: "logs/:status",
    route: "/logs/:status",
    element: <LazyRoute component={Logs} />,
  },
  {
    name: "Algo Setup",
    path: "/algo",
    key: "algo",
    route: "/algo",
    element: <LazyRoute component={Algo} />,
  },
  {
    name: "Scalping",
    path: "/scalping",
    key: "scalping",
    route: "/scalping",
    element: <LazyRoute component={Scalping} />,
  },
  {
    name: "Algo Trading",
    path: "/algotrading",
    key: "algotrading",
    route: "/algotrading",
    element: <LazyRoute component={AlgoTrading} />,
  },
  {
    name: "Back Test",
    path: "/backtest",
    key: "backtest",
    route: "/backtest",
    element: <LazyRoute component={BackTest} />,
  },
  {
    name: "Chart",
    path: "/chart",
    key: "chart",
    route: "/chart",
    element: <LazyRoute component={Chart} />,
  },
  {
    name: "Notification",
    path: "/notification",
    key: "notification",
    route: "/notification",
    element: <LazyRoute component={Notification} />,
  },
  {
    name: "Profile",
    path: "/profile",
    key: "profile",
    route: "/profile",
    element: <LazyRoute component={Profile} />,
  },
  {
    name: "Api Docs",
    path: "/api-docs",
    key: "api-docs",
    route: "/api-docs",
    element: <LazyRoute component={ApiDocs} />,
  }, 

  {
    name: "Faq",
    path: "/faq",
    key: "faq",
    route: "/faq",
    element: <LazyRoute component={Faq} />,
  },
  {
    name: "Strategy Description",
    path: "/strategy/:strategy_id",
    key: "strategy/:strategy_id",
    route: "/strategy/:strategy_id",
    element: <LazyRoute component={StrategyDescription} />,
  },
  {
    name: "Create Strategy",
    path: "/create-strategy",
    key: "create-strategy",
    route: "/create-strategy",
    element: <LazyRoute component={CreateStrategy} />,
  },
  

   {
    name: "Strategy List",
    path: "/strategy-list",
    key: "strategy-list",
    route: "/strategy-list",
    element: <LazyRoute component={StrategyList} />,
  },
  {
    name: "Strategy Backtest",
    path: "/strategy-backtest/:strategyId",
    key: "strategy-backtest",
    route: "/strategy-backtest",
    element: <LazyRoute component={StrategyBacktest} />,
  },


  {
    name: "News",
    path: "/news",
    key: "news",
    route: "/news",
    element: <LazyRoute component={News} />,
  },

  {
    name: "Article Detail",
    path: "/news/article/:id",
    key: "news/article/:id",
    route: "/news/article/:id",
    element: <LazyRoute component={NewsDetail} />,
  },
  {
    name: "Learning Center",
    path: "/learning-center",
    key: "learning-center",
    route: "/learning-center",
    element: <LazyRoute component={LearningCenter} />,
  },
  {
    name: "Plans",
    path: "/plans",
    key: "plans",
    route: "/plans",
    element: <LazyRoute component={Plans} />,
  },
  {
    name: "Checkout",
    path: "/checkout",
    key: "checkout",
    route: "/checkout",
    element: <LazyRoute component={Checkout} />,
  },
  {
    name: "Payment History",
    path: "/payment-history",
    key: "payment-history",
    route: "/payment-history",
    element: <LazyRoute component={PaymentHistory} />,
  },
  {
    name: "KYC List",
    path: "/kyc-list",
    key: "kyc-list",
    route: "/kyc-list",
    element: <LazyRoute component={KycList} />,
  },
];

export default RouteArr;


