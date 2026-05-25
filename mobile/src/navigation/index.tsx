import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../theme/colors';

// Auth screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { NewPasswordScreen } from '../screens/auth/NewPasswordScreen';

// User screens
import { DashboardScreen } from '../screens/user/DashboardScreen';
import { ApplyLeaveScreen } from '../screens/user/ApplyLeaveScreen';
import { LeaveHistoryScreen } from '../screens/user/LeaveHistoryScreen';

// Admin screens
import { ApproveLeaveScreen } from '../screens/admin/ApproveLeaveScreen';
import { TeamLeaveHistoryScreen } from '../screens/admin/TeamLeaveHistoryScreen';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  NewPassword: undefined;
};

export type UserTabParamList = {
  Dashboard: undefined;
  ApplyLeave: undefined;
  LeaveHistory: undefined;
};

export type AdminTabParamList = {
  Dashboard: undefined;
  ApplyLeave: undefined;
  LeaveHistory: undefined;
  ApproveLeave: undefined;
  TeamHistory: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const UserTab = createBottomTabNavigator<UserTabParamList>();
const AdminTab = createBottomTabNavigator<AdminTabParamList>();

function UserTabs() {
  return (
    <UserTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Dashboard: ['home', 'home-outline'],
            ApplyLeave: ['add-circle', 'add-circle-outline'],
            LeaveHistory: ['list', 'list-outline'],
          };
          const [activeIcon, inactiveIcon] = icons[route.name] ?? ['circle', 'circle-outline'];
          return (
            <Ionicons
              name={(focused ? activeIcon : inactiveIcon) as any}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <UserTab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <UserTab.Screen name="ApplyLeave" component={ApplyLeaveScreen} options={{ title: 'Apply' }} />
      <UserTab.Screen name="LeaveHistory" component={LeaveHistoryScreen} options={{ title: 'History' }} />
    </UserTab.Navigator>
  );
}

function AdminTabs() {
  return (
    <AdminTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Dashboard: ['home', 'home-outline'],
            ApplyLeave: ['add-circle', 'add-circle-outline'],
            LeaveHistory: ['list', 'list-outline'],
            ApproveLeave: ['checkmark-circle', 'checkmark-circle-outline'],
            TeamHistory: ['people', 'people-outline'],
          };
          const [activeIcon, inactiveIcon] = icons[route.name] ?? ['circle', 'circle-outline'];
          return (
            <Ionicons
              name={(focused ? activeIcon : inactiveIcon) as any}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <AdminTab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <AdminTab.Screen name="ApplyLeave" component={ApplyLeaveScreen} options={{ title: 'Apply' }} />
      <AdminTab.Screen name="LeaveHistory" component={LeaveHistoryScreen} options={{ title: 'My Leaves' }} />
      <AdminTab.Screen
        name="ApproveLeave"
        component={ApproveLeaveScreen}
        options={{ title: 'Approvals' }}
      />
      <AdminTab.Screen
        name="TeamHistory"
        component={TeamLeaveHistoryScreen}
        options={{ title: 'Team' }}
      />
    </AdminTab.Navigator>
  );
}

export function AppNavigation() {
  const { isAuthenticated, isLoading, user, newPasswordRequired } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.foreground} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated || newPasswordRequired ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <AuthStack.Screen name="NewPassword" component={NewPasswordScreen} />
        </AuthStack.Navigator>
      ) : user?.role === 'admin' ? (
        <AdminTabs />
      ) : (
        <UserTabs />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
