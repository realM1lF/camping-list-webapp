import { i } from '@instantdb/core';

const _schema = i.schema({
	entities: {
		$files: i.entity({
			path: i.string().unique().indexed(),
			url: i.string()
		}),
		$users: i.entity({
			email: i.string().unique().indexed()
		}),
		profiles: i.entity({
			name: i.string(),
			emoji: i.string().optional(),
			createdAt: i.number()
		}),
		trips: i.entity({
			name: i.string(),
			year: i.number().indexed(),
			location: i.string().optional(),
			startDate: i.string().optional(),
			endDate: i.string().optional(),
			createdAt: i.number()
		}),
		items: i.entity({
			name: i.string(),
			emoji: i.string(),
			category: i.string().indexed(),
			neededCount: i.number(),
			createdAt: i.number()
		}),
		claims: i.entity({
			count: i.number(),
			createdAt: i.number()
		}),
		comments: i.entity({
			text: i.string(),
			createdAt: i.number().indexed()
		})
	},
	links: {
		profileUser: {
			forward: { on: 'profiles', has: 'one', label: '$user' },
			reverse: { on: '$users', has: 'one', label: 'profile' }
		},
		profileAvatar: {
			forward: { on: 'profiles', has: 'one', label: 'avatar' },
			reverse: { on: '$files', has: 'one', label: 'profile' }
		},
		tripCreator: {
			forward: { on: 'trips', has: 'one', label: 'createdBy' },
			reverse: { on: 'profiles', has: 'many', label: 'createdTrips' }
		},
		itemTrip: {
			forward: { on: 'items', has: 'one', label: 'trip' },
			reverse: { on: 'trips', has: 'many', label: 'items' }
		},
		itemCreator: {
			forward: { on: 'items', has: 'one', label: 'createdBy' },
			reverse: { on: 'profiles', has: 'many', label: 'createdItems' }
		},
		claimItem: {
			forward: { on: 'claims', has: 'one', label: 'item' },
			reverse: { on: 'items', has: 'many', label: 'claims' }
		},
		claimUser: {
			forward: { on: 'claims', has: 'one', label: 'user' },
			reverse: { on: 'profiles', has: 'many', label: 'claims' }
		},
		commentItem: {
			forward: { on: 'comments', has: 'one', label: 'item' },
			reverse: { on: 'items', has: 'many', label: 'comments' }
		},
		commentAuthor: {
			forward: { on: 'comments', has: 'one', label: 'author' },
			reverse: { on: 'profiles', has: 'many', label: 'comments' }
		}
	}
});

export type AppSchema = typeof _schema;
export default _schema;
