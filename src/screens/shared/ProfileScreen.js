import React from 'react'; import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native'; import LinearGradient from 'react-native-linear-gradient'; import { Colors } from '../../theme'; import { useAuth } from '../../hooks/useAuth';
const ROLE_COLOR = { admin:'#7C3AED', sales:Colors.primary, warehouse:Colors.warning, accountant:Colors.success, customer:'#DB2777' };
export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const handleLogout = () => { Alert.alert('Sign out', 'Are you sure?', [{ text:'Cancel', style:'cancel' }, { text:'Sign out', style:'destructive', onPress: logout }]); };
  const roleColor = ROLE_COLOR[user?.role] || Colors.primary;
  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray50 }}>
      <LinearGradient colors={[roleColor, roleColor + 'CC']} style={{ paddingTop: 80, paddingBottom: 32, alignItems: 'center' }}>
        <View style={{ width:72, height:72, borderRadius:36, backgroundColor:'rgba(255,255,255,0.25)', justifyContent:'center', alignItems:'center', marginBottom:12 }}>
          <Text style={{ fontSize:30, fontWeight:'800', color:Colors.white }}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={{ fontSize:22, fontWeight:'800', color:Colors.white }}>{user?.name}</Text>
        <Text style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:4, letterSpacing:1, fontWeight:'700' }}>{user?.role?.toUpperCase()}</Text>
        <Text style={{ fontSize:13, color:'rgba(255,255,255,0.8)', marginTop:4 }}>{user?.phone}</Text>
      </LinearGradient>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ backgroundColor:Colors.white, borderRadius:16, overflow:'hidden', shadowColor:'#000', shadowOpacity:0.05, elevation:2 }}>
          {[['👤','Name',user?.name],['📱','Phone',user?.phone],['📧','Email',user?.email||'—'],['🏷','Role',user?.role]].map(([icon,label,val]) => (
            <View key={label} style={{ flexDirection:'row', alignItems:'center', padding:14, borderBottomWidth:1, borderBottomColor:Colors.gray100 }}>
              <Text style={{ fontSize:20, marginRight:12 }}>{icon}</Text>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:10, color:Colors.gray400, fontWeight:'600', textTransform:'uppercase', letterSpacing:0.5 }}>{label}</Text>
                <Text style={{ fontSize:14, color:Colors.gray900, fontWeight:'500', marginTop:1 }}>{val}</Text>
              </View>
            </View>
          ))}
        </View>
        <TouchableOpacity style={{ marginTop:20, backgroundColor:Colors.dangerBg, borderRadius:14, paddingVertical:14, alignItems:'center', borderWidth:1, borderColor:Colors.dangerBorder }} onPress={handleLogout}>
          <Text style={{ color:Colors.danger, fontSize:15, fontWeight:'700' }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
