import React from "react";
import { Helmet } from "react-helmet";
import { useSelector } from "react-redux";

const SeoHelmet = ({ metaData }) => {
  const { companyDetails } = useSelector((state) => state?.companyDetails);

  return (
    <Helmet>
      <link
        rel="preconnect"
        href={companyDetails?.companyLogo}
        type="image/svg+xml"
      />
      <link
        rel="image"
        href={companyDetails?.companyLogo}
        type="image/svg+xml"
      />
      <link id="favicon" rel="icon" href={companyDetails?.companyLogo} />

      <title>{companyDetails?.companyName}</title>
      <fav>{companyDetails?.companyName}</fav>

      {companyDetails?.companyName && (
        <meta name="description" content={companyDetails?.companyName} />
      )}
    </Helmet>
  );
};

export default React.memo(SeoHelmet);
