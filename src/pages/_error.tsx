import { robotBlockingPageProps } from '@config/SEO/DefaultSeoProps';
import SeoHead from '@config/SEO/SeoHeader';
import Error from '@presentational/Layout/ErrorPage';
import type { NextPage } from 'next';
import React from 'react';

const ErrorPage: NextPage = () => {
	return (
		<>
			<SeoHead
				additionalSeoProps={{
					title: '500',
					description: "How'd you get here?",
					nofollow: true,
					noindex: true,
					robotsProps: robotBlockingPageProps
				}}
			/>
			<Error />
		</>
	);
};

export default ErrorPage;
