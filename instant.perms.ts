// Berechtigungen: Jeder eingeloggte Nutzer darf lesen + anlegen.
// Löschen/Ändern von Items nur durch den Ersteller.
// Push mit: npx instant-cli push perms
export default {
	$files: {
		allow: {
			view: 'auth.id != null',
			create: "auth.id != null && data.path.startsWith(auth.id + '/')",
			update: 'false',
			delete: "auth.id != null && data.path.startsWith(auth.id + '/')"
		}
	},
	profiles: {
		allow: {
			view: 'auth.id != null',
			create: 'auth.id != null',
			update: 'auth.id == data.ref("$user.id")[0]',
			delete: 'false'
		}
	},
	trips: {
		allow: {
			view: 'auth.id != null',
			create: 'auth.id != null',
			update: 'auth.id != null',
			delete: 'auth.id == data.ref("createdBy.$user.id")[0]'
		}
	},
	items: {
		allow: {
			view: 'auth.id != null',
			create: 'auth.id != null',
			update: 'auth.id == data.ref("createdBy.$user.id")[0]',
			delete: 'auth.id == data.ref("createdBy.$user.id")[0]'
		}
	},
	claims: {
		allow: {
			view: 'auth.id != null',
			create: 'auth.id != null',
			update: 'auth.id == data.ref("user.$user.id")[0]',
			delete: 'auth.id == data.ref("user.$user.id")[0]'
		}
	},
	comments: {
		allow: {
			view: 'auth.id != null',
			create: 'auth.id != null',
			update: 'false',
			delete: 'auth.id == data.ref("author.$user.id")[0]'
		}
	}
};
