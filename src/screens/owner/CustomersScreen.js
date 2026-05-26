import React, { useState, useEffect } from 'react'; import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native'; import { Colors } from '../../theme'; import { customerService } from '../../services/api';
export default function CustomersScreen() {
  const [customers, setCustomers] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { customerService.getAll().then(r => setCustomers(r.data)).finally(() => setLoading(false)); }, []);
  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator color={Colors.primary} /></View>;
  return <FlatList data={customers} keyExtractor={i=>i.id} contentContainerStyle={{padding:16}} renderItem={({item:c}) => (
    <View style={{backgroundColor:Colors.white,borderRadius:14,padding:14,marginBottom:10,shadowColor:'#000',shadowOpacity:0.05,elevation:2}}>
      <Text style={{fontSize:15,fontWeight:'700',color:Colors.gray900}}>{c.name}</Text>
      <Text style={{fontSize:12,color:Colors.gray500,marginTop:2}}>{c.phone}</Text>
      {c.company_name && <Text style={{fontSize:11,color:Colors.primary,marginTop:1}}>{c.company_name}</Text>}
    </View>
  )} ListHeaderComponent={<Text style={{fontSize:20,fontWeight:'800',color:Colors.gray900,marginBottom:16}}>Customers ({customers.length})</Text>} />;
}
