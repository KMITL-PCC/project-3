import authService from "../services/auth.service";

const authController = {
	handleLogin: (req: any, res: any) => {
		const { email, password } = req.body;
		const result = authService.login(email, password);
		res.send(result);
	},
	handleRegister: (req: any, res: any) => {
		const result = authService.register(req.body);
		res.send(result);
	},
	handleLogout: (req: any, res: any) => {
		const result = authService.logout();
		res.send(result);
	},
	handleRefreshToken: (req: any, res: any) => {
		const { token } = req.body;
		const result = authService.refreshToken(token);
		res.send(result);
	},
};

export default authController;
