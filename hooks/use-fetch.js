//data ,error ,loading we want these states to be managed 

import { useState } from "react"
import { toast } from "sonner"

const useFetch = (cb) => {
    const [data, setData] = useState(undefined)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(null)



    const fn = async (...args) => {
        //before fetching our api we will set our default vvalue 
        setLoading(true)
        setError(null)

        try {
            const response = await cb(...args);
            setData(response)
            setError(null)

        } catch (error) {
            setError(error);
            //we will now display toast by shadcn  call toster in layout.js <Toaster/>
            toast.error(error.message)
        }finally{
            setLoading(false);
        }
    }

    return { data, error, loading, fn, setData };
}

export default useFetch;