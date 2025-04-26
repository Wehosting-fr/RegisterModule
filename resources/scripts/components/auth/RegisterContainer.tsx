import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import register from '@/api/auth/register';
import RegisterFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import Field from '@/components/elements/Field';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';

interface Values {
    email: string;
    username: string;
    firstname: string;
    lastname: string;
}

const RegisterContainer = () => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();
    }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        // If there is no token in the state yet, request the token and then abort this submit request
        // since it will be re-submitted when the recaptcha data is returned by the component.
        if (recaptchaEnabled && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });

            return;
        }

        register({ ...values, recaptchaData: token })
            .then((response) => {
                if (response.complete) {
                    addFlash({
                        type: 'success',
                        title: 'Succès',
                        message: 'Vous vous êtes inscrit avec succès, vérifiez votre email',
                    });

                    setSubmitting(false);
                }
            })
            .catch((error) => {
                console.error(error);

                setToken('');
                if (ref.current) ref.current.reset();

                const data = JSON.parse(error.config.data);

                if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*[a-zA-Z0-9]$/.test(data.username))
                    error =
                        "Le nom d'utilisateur doit commencer et se terminer par des caractères alphanumériques et ne contenir que des lettres, des chiffres, des tirets, des underscores et des points.";
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) error = 'The email must be a valid email address.';

                setSubmitting(false);
                if (typeof error === 'string') {
                    addFlash({
                        type: 'error',
                        title: 'Error',
                        message: error || '',
                    });
                } else {
                    clearAndAddHttpError({ error });
                }
            });
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{ email: '', username: '', firstname: '', lastname: '' }}
            validationSchema={object().shape({
            email: string().required('Un email doit être fourni.'),
            username: string().required('Un nom d’utilisateur doit être fourni.'),
            firstname: string().required('Un prénom doit être fourni.'),
            lastname: string().required('Un nom de famille doit être fourni.'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
            <RegisterFormContainer title={'Formulaire d’inscription'} css={tw`w-full flex`}>
                <Field
                light
                type={'email'}
                label={'Email'}
                name={'email'}
                placeholder={'exemple@gmail.com'}
                disabled={isSubmitting}
                />
                <div css={tw`mt-6`}>
                <Field
                    light
                    type={'text'}
                    label={'Nom d’utilisateur'}
                    name={'username'}
                    placeholder={'Nom d’utilisateur'}
                    disabled={isSubmitting}
                />
                </div>
                <div css={tw`mt-6`}>
                <Field
                    light
                    type={'text'}
                    label={'Prénom'}
                    name={'firstname'}
                    placeholder={'Prénom'}
                    disabled={isSubmitting}
                />
                </div>
                <div css={tw`mt-6`}>
                <Field
                    light
                    type={'text'}
                    label={'Nom de famille'}
                    name={'lastname'}
                    placeholder={'Nom de famille'}
                    disabled={isSubmitting}
                />
                </div>
                <div css={tw`mt-6`}>
                <Button type={'submit'} size={'xlarge'} isLoading={isSubmitting} disabled={isSubmitting}>
                    S’inscrire
                </Button>
                </div>

                {recaptchaEnabled && (
                <Reaptcha
                    ref={ref}
                    size={'invisible'}
                    sitekey={siteKey || '_invalid_key'}
                    onVerify={(response) => {
                    setToken(response);
                    submitForm();
                    }}
                    onExpire={() => {
                    setSubmitting(false);
                    setToken('');
                    }}
                />
                )}
                <div css={tw`mt-6 text-center`}>
                <Link
                    to={'/auth/login'}
                    css={tw`text-xs text-neutral-500 tracking-wide no-underline uppercase hover:text-neutral-600`}
                >
                    Déjà inscrit ?
                </Link>
                </div>
            </RegisterFormContainer>
            )}
        </Formik>
    );
};

export default RegisterContainer;
