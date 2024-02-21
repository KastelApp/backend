// ? Note: This is for when you have registered an account, it welcomes you and has a link to verify your email

import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from "@react-email/components";

const styles = {
    main: {
        backgroundColor: "#161922",
        fontFamily: "sans-serif",
    },
    container: {
        backgroundColor: "#101319",
        color: "#CFDBFF",
        padding: "20px 20px 20px",
        margin: "0 auto",
    },
    logo: {
        icon: {
            width: "50px",
            height: "50px",
            borderRadius: "50%"
        },
        text: {
            fontSize: "2rem",
            fontWeight: "bold",
            marginLeft: "1rem",
        },
        container: {
            display: "flex",
            alignItems: "center",
        }
    },
    header: {
        fontSize: "1.2rem",
        lineHeight: "1.5rem",
    },
    paragraph: {
        fontSize: "1rem",
        lineHeight: "1.5rem",
    },
    btnContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    btn: {
        backgroundColor: "#9AA9E0",
        color: "#161922",
        padding: "1rem",
        borderRadius: "1rem",
        textDecoration: "none",
        fontWeight: "bold",
        fontSize: ".8rem",
        // center
        display: "flex",
    },
    btnText: {
        textAlign: "center",
        fontSize: "0.8rem",
        color: "#CFDBFF",
    },
    hr: { // HR: Display a divider that separates content areas in your email.
        borderColor: "#262F40",
        margin: "15px 0",
    },
    footer: {
        fontSize: ".6rem",
        textAlign: "center",
    },
} as const;

const imrUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAYAAADL1t+KAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAgAElEQVR4nO3dd3wVZb4/8M9p6ZV0SAgkwdBBOtJBRV0VdO3K6hZdt6nby927q97dvavrrrr726p3xbVjw64gHaT30EMNIRVIb6f9/hg6AZKTM/Odeebzfr2OKJhzPjmczGeeZ2aecQAIgoiIiCzNKR2AiIiIuo6FTkREpAAWOhERkQJY6ERERApgoRMRESmAhU5ERKQAFjoREZECWOhEREQKYKETEREpgIVORESkABY6ERGRAljoRERECmChExERKYCFTkREpAAWOhERkQJY6ERERApgoRMRESmAhU5ERKQAFjoREZECWOhEREQKYKETEREpgIVORESkABY6ERGRAljoRERECmChExERKYCFTkREpAAWOhERkQJY6ERERApgoRMRESmAhU5ERKQAFjoREZECWOhEREQKYKETEREpgIVORESkABY6ERGRAljoRERECmChExERKYCFTkREpAAWOhERkQJY6ERERApgoRMRESmAhU5ERKQAFjoREZECWOhEREQKYKETEREpgIVORESkABY6ERGRAljoRERECmChExERKYCFTkREpAAWOhERkQJY6ERERApgoRMRESmAhU5ERKQAFjoREZECWOhEREQKYKETEREpgIVORESkABY6ERGRAljoRERECmChExERKYCFTkREpAAWOhERkQJY6ERERApgoRMRESmAhU5ERKQAFjoREZECWOhEREQKYKETEREpgIVORESkABY6ERGRAljoRERECmChExERKYCFTkREpAAWOhERkQJY6ERERApwSwcg60uM6oGsxMHIShyEzIRBSI7JRYQrBh5XNNyuKHic0fC4ohEdkQQA8Pqb2320+hpQ3bgHZbVbUFa7FWV1W9DirRX+7og6xuOKRmbCQGQlDEJm4iBkxPdDlCcJHpf2+fc4o078TEQj0h0LAGjx1p3/sxBoRn1LufZzULcVZbVbcLRxr/B3R1bgABCUDkHWEOGKPVHcg5GVMOhUgcdEJOv2mjXNh1FeuxVHareg/MTGrbJ+J/xBr26vSXQxDjiQGtcHmSd+BrSfhcHoFpsHp0OfSc82XxPK64pOFXx53VaU1mxCs/e4Lq9H1sRCp4uKieiG/NQp6JM+FQVpU5Ee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";

const registration = (username: string, verifyUrl: string, deleteAccountUrl: string) => {
    return (
        <Html>
            <Head />
            <Preview>
                Welcome to Kastel, Verify your email to get started!
            </Preview>
            <Body style={styles.main}>
                <Container style={styles.container}>
                    <div style={styles.logo.container}>
                        <Img src={imrUrl} alt="Kastel Logo" style={styles.logo.icon} />
                        <Heading style={styles.logo.text}>Kastel</Heading>
                    </div>
                    <Text style={styles.header}>
                        Welcome to Kastel, {username}!
                    </Text>
                    <br />
                    <Text style={styles.paragraph}>
                        Thank you for signing up to Kastel. We are very excited to have you here, I hope you will enjoy our community.
                    </Text>
                    <br />
                    <Hr style={styles.hr} />
                    <Text style={styles.btnText}>
                        Before you can truly enjoy Kastel, you'll need to verify your email. Don't worry, it's easy; Just click the link or button below.
                    </Text>
                    <Section style={styles.btnContainer}>
                        <Button style={styles.btn} href={verifyUrl}>
                            Verify Email
                        </Button>
                    </Section>
                    <Text style={styles.footer}>
                        If you did not sign up for kastel, please click on this link to delete the account <Link href={deleteAccountUrl}>Delete Account</Link>
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default registration;
