import React, {useState, useEffect, useCallback} from 'react';
import {getWPFormsMetaData} from '../utils/meta-data';
import {prettyPrintJson} from 'pretty-print-json';

export function FormPanel( {formId} ) {
	const [ activeMenuItem, setActiveMenuItem ] = useState( 'form_data' );
	const [ formData, setFormData ] = useState( null );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState( null );

	const fetchFormData = useCallback( async () => {
		if ( ! formId ) {
			console.log( '[WPF Debug] No form ID provided, skipping fetch.' );
			return;
		}

		console.log( '[WPF Debug] Fetching form data for ID:', formId );
		setIsLoading( true );
		setError( null );

		try {
			const metaData = await getWPFormsMetaData();
			console.log( '[WPF Debug] Meta data received:', metaData );

			if ( ! metaData?.ajax_url ) {
				throw new Error( 'Ajax URL not found in meta data.' );
			}

			console.log( '[WPF Debug] Making fetch request to:', metaData.ajax_url );
			const response = await fetch( metaData.ajax_url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams( {
					action: 'wpf_chrome_ext_form_data',
					form_id: formId, // eslint-disable-line camelcase
					nonce: metaData.nonce,
				} )
			} );

			const result = await response.json();
			console.log( '[WPF Debug] API response:', result );

			if ( result.error ) {
				throw new Error( result.error );
			}

			console.log( '[WPF Debug] Setting form data:', result );
			setFormData( result );
		} catch ( err ) {
			const errorMessage = err.message;
			console.error( '[WPF Debug] Error in fetchFormData:', {
				message: errorMessage,
				error: err
			} );
			setError( errorMessage );
		} finally {
			console.log( '[WPF Debug] Fetch operation completed.' );
			setIsLoading( false );
		}
	}, [ formId ] );

	useEffect( () => {
		if ( activeMenuItem === 'form_data' ) {
			fetchFormData();
		}
	}, [ activeMenuItem, formId, fetchFormData ] );

	if ( ! formId ) {
		return null;
	}

	const menuItems = [
		{id: 'form_data', label: 'Form Data'},
		//{ id: 'test', label: 'Test' },
	];

	const renderContent = () => {
		if ( activeMenuItem !== 'form_data' ) {
			return null;
		}

		if ( isLoading ) {
			return <div className="loading">Loading form data...</div>;
		}

		if ( error ) {
			return <div className="error">Error: { error }</div>;
		}

		if ( ! formData || ! formData.data ) {
			return <div className="empty">No form data available.</div>;
		}

		return (
			<pre
				className="form-data"
				dangerouslySetInnerHTML={ {__html: prettyPrintJson.toHtml( formData.data )} }
			/>
		);
	};

	return (
		<div className="form-panel">
			<div className="sidebar">
				<ul className="menu">
					{ menuItems.map( item => (
						<li
							key={ item.id }
							className={ `menu-item ${ activeMenuItem === item.id ? 'active' : '' }` }
							onClick={ () => setActiveMenuItem( item.id ) }
						>
							{ item.label }
						</li>
					) ) }
				</ul>
			</div>
			<div className="content">
				{ renderContent() }
			</div>
		</div>
	);
}
