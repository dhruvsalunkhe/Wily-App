import firebase from 'firebase'
import React from 'react'
import { Alert, KeyboardAvoidingView,Text,StyleSheet,TouchableOpacity,TextInput,View,Image } from 'react-native'

export default class LoginScreen extends React.Component{
    constructor(){
        super()
        this.state = {
            emailId :'',
            password : '',
        }
    }
    login = async(emailId , password)=>{
        if(emailId && password){
            try {
                const response = await firebase.auth().signInWithEmailAndPassword(emailId,password)
                if(response){
                    this.props.navigation.navigate("Transaction")
                }
                
            } catch (error) {
                switch(error.code){
                    case "auth/user-not-found":
                        Alert.alert("user doesnt exit in the database")
                        break
                    case "auth/invalid-email":
                    Alert.alert("incorrect emailId or password")
                }
                
            }
        }
        else {
            Alert.alert("enter emailId and password")
        }
    }
    render(){
        return(
            <KeyboardAvoidingView style = {{alignItems:'center',marginTop:20}}>
               
            <View>
              <Image 
              source ={require('../assets/booklogo.jpg')} 
              style = {{width : 200 , height : 200}}
               />
               <Text style = {{textAlign : 'center' , fontSize : 30}}>
                WILY
               </Text>
            </View>

            <View>
              <TextInput style = {styles.loginBox} 
              placeholder = "abc@example.com"
              keyboardType = 'email-address'
              onChangeText = {text=>this.setState({emailId:text})}
              value = {this.state.emailId} />

              <TextInput style = {styles.loginBox} 
              placeholder = "Enter Password"
              onChangeText = {text=>this.setState({password:text})}
              secureTextEntry = {true} />
            </View>

            <View>
              <TouchableOpacity style = {{height : 30,width : 90 , borderWidth : 1, marginTop : 20, paddingTop : 5 , borderRadius : 7}} 
                onPress ={async()=>{
                  this.login(this.state.emailId , this.state.password)
                }} >
              <Text style = {{textAlign : 'center'}}>
                Login
              </Text>

              </TouchableOpacity>

          
              </View>
            </KeyboardAvoidingView>
        )
    }
}
const styles = StyleSheet.create({ loginBox: { width: 300, height: 40, borderWidth: 1.5, fontSize: 20, margin:10, paddingLeft:10 } })