import { createSlice } from "@reduxjs/toolkit";

const ownerSlice=createSlice({
    name:"owner",
    initialState:{
        myItems:[]
    },
    reducers:{
        setMyItems:(state,action)=>{
        state.myItems=action.payload
        }
    }
})

export const {setMyItems}=ownerSlice.actions
export default ownerSlice.reducer