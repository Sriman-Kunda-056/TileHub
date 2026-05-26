import React from 'react'; import { View, Text, TouchableOpacity } from 'react-native'; import { Colors } from '../../theme';
export default function CreateOrderScreen({ navigation }) {
  return <View style={{flex:1,justifyContent:'center',alignItems:'center',padding:24,backgroundColor:Colors.gray50}}>
    <Text style={{fontSize:32,marginBottom:12}}>🛒</Text>
    <Text style={{fontSize:18,fontWeight:'700',color:Colors.gray900,marginBottom:8}}>Create Order</Text>
    <Text style={{color:Colors.gray500,textAlign:'center',marginBottom:24}}>Use "Create Bill" for a faster end-to-end flow that creates order + invoice + shipment in one step.</Text>
    <TouchableOpacity style={{backgroundColor:Colors.primary,borderRadius:12,paddingVertical:13,paddingHorizontal:24}} onPress={() => navigation.navigate('CreateBill')}>
      <Text style={{color:Colors.white,fontWeight:'700',fontSize:14}}>→ Go to Create Bill</Text>
    </TouchableOpacity>
  </View>;
}
