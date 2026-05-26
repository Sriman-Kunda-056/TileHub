import React, { useState, useEffect } from 'react'; import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'; import QRCode from 'react-native-qrcode-svg'; import { Colors } from '../../theme'; import { billingService } from '../../services/api';
export default function InvoiceDetailScreen({ route, navigation }) {
  const { invoiceId } = route.params; const [inv, setInv] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { billingService.getInvoice(invoiceId).then(r => setInv(r.data)).finally(() => setLoading(false)); }, [invoiceId]);
  if (loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator color={Colors.primary} /></View>;
  if (!inv) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>Invoice not found</Text></View>;
  const handleRecordPayment = () => { Alert.alert('Record Payment', 'Go to the web dashboard to record payment for this invoice.'); };
  return (
    <ScrollView style={{flex:1,backgroundColor:Colors.gray50}} contentContainerStyle={{padding:16}}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{color:Colors.primary,marginBottom:12,fontWeight:'600'}}>← Back</Text></TouchableOpacity>
      <View style={{backgroundColor:Colors.white,borderRadius:16,padding:18,marginBottom:12,shadowColor:'#000',shadowOpacity:0.05,elevation:2}}>
        <Text style={{fontSize:10,color:Colors.gray400,letterSpacing:1,fontWeight:'700',marginBottom:4}}>INVOICE</Text>
        <Text style={{fontSize:18,fontWeight:'800',color:Colors.gray900}}>{inv.invoice_number}</Text>
        <Text style={{fontSize:14,color:Colors.gray600,marginTop:4}}>{inv.customer_name}</Text>
        <Text style={{fontSize:12,color:Colors.gray400,marginTop:2}}>{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</Text>
      </View>
      <View style={{backgroundColor:Colors.white,borderRadius:16,padding:18,marginBottom:12,shadowColor:'#000',shadowOpacity:0.05,elevation:2}}>
        {[['Subtotal',`₹${parseInt(inv.subtotal).toLocaleString('en-IN')}`],['CGST 9%',`₹${parseInt(inv.cgst_amount).toLocaleString('en-IN')}`],['SGST 9%',`₹${parseInt(inv.sgst_amount).toLocaleString('en-IN')}`]].map(([l,v])=>(
          <View key={l} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:5}}><Text style={{color:Colors.gray500}}>{l}</Text><Text style={{color:Colors.gray700,fontWeight:'500'}}>{v}</Text></View>
        ))}
        <View style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:8,borderTopWidth:1,borderTopColor:Colors.gray100,marginTop:4}}>
          <Text style={{fontWeight:'800',color:Colors.gray900,fontSize:15}}>Total</Text>
          <Text style={{fontWeight:'800',color:Colors.success,fontSize:16}}>₹{parseInt(inv.total_amount).toLocaleString('en-IN')}</Text>
        </View>
        <View style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:4}}>
          <Text style={{color:Colors.gray500}}>Paid</Text><Text style={{color:Colors.success,fontWeight:'600'}}>₹{parseInt(inv.amount_paid||0).toLocaleString('en-IN')}</Text>
        </View>
        <View style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:4}}>
          <Text style={{color:Colors.gray500}}>Balance</Text><Text style={{color:Colors.danger,fontWeight:'700',fontSize:14}}>₹{parseInt(parseFloat(inv.total_amount)-parseFloat(inv.amount_paid||0)).toLocaleString('en-IN')}</Text>
        </View>
      </View>
      {inv.payment_status !== 'paid' && (
        <TouchableOpacity style={{backgroundColor:Colors.success,borderRadius:14,paddingVertical:14,alignItems:'center',marginBottom:12}} onPress={handleRecordPayment}>
          <Text style={{color:Colors.white,fontWeight:'700',fontSize:14}}>+ Record Payment</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
