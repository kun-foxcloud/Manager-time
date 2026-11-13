import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { User } from '../data/catalog';

type Props = {
  users: User[];
  size?: number;
};

export function AvatarStack({ users, size = 22 }: Props) {
  const shown = users.slice(0, 3);
  const extra = users.length - shown.length;

  return (
    <View style={styles.row}>
      {shown.map((u, index) => (
        <View
          key={u.id}
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: u.color,
              marginLeft: index === 0 ? 0 : -size / 4,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{u.initials}</Text>
        </View>
      ))}
      {extra > 0 && (
        <View
          style={[
            styles.avatar,
            styles.extraBubble,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -size / 4,
            },
          ]}
        >
          <Text style={[styles.extraText, { fontSize: size * 0.34 }]}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  extraBubble: {
    backgroundColor: '#EDF0F8',
  },
  extraText: {
    color: '#6B7590',
    fontWeight: '700',
  },
});
