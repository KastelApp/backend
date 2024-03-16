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
import { imrUrl } from "./Image.tsx";

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
			borderRadius: "50%",
		},
		text: {
			fontSize: "2rem",
			fontWeight: "bold",
			marginLeft: "1rem",
		},
		container: {
			display: "flex",
			alignItems: "center",
		},
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
	hr: {
		borderColor: "#262F40",
		margin: "15px 0",
	},
	footer: {
		fontSize: ".6rem",
		textAlign: "center",
	},
} as const;

const forgotPassword = (username: string, resetPasswordUrl: string) => {
	return (
		<Html>
			<Head />
			<Preview>Reset your Kastel password</Preview>
			<Body style={styles.main}>
				<Container style={styles.container}>
					<div style={styles.logo.container}>
						<Img src={imrUrl} alt="Kastel Logo" style={styles.logo.icon} />
						<Heading style={styles.logo.text}>Kastel</Heading>
					</div>
					<Text style={styles.header}>Hello {username},</Text>
					<br />
					<Text style={styles.paragraph}>
						We received a request to reset your password. If you did not make this request, please ignore this email. Otherwise, you can reset your password using the button below.
					</Text>
					<br />
					<Hr style={styles.hr} />
					<Text style={styles.btnText}>
						Click the button below to reset your password.
					</Text>
					<Section style={styles.btnContainer}>
						<Button style={styles.btn} href={resetPasswordUrl}>
							Reset Password
						</Button>
					</Section>
					<Text style={styles.footer}>
						If you have any questions, feel free to contact our support team.
					</Text>
				</Container>
			</Body>
		</Html>
	);
};


export default forgotPassword
