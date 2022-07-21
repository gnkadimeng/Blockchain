import React from 'react';
import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import moment from 'moment';

const CREATE_PRODUCT_MUTATION = gql`
mutation($id: ID!) {
  createProduct(id: $id) {
    id
    state
    history {
      manufactured
      inspected
      shipped
      stocked
      labeled
      sold
    }
  }
}`;

const PRODUCTS_QUERY = gql`
  query GetProducts {
    products {
      id
      state
      history {
        manufactured
        inspected
        shipped
        stocked
        labeled
        sold
      }
    }
  }
`;

const UNAMBIGUOUS_ALPHANUMERIC = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function randomString(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

export default ({user}) => {
  const userCanManufacture = () => {
    const permissions = user.attributes['custom:permissions'].split('_');
    return permissions.includes('manufacture');
  };
  if (!userCanManufacture()) return '';
  
  const [
    createProduct,
    { loading: mutationLoading, error: mutationError }
  ] = useMutation(
    CREATE_PRODUCT_MUTATION, {
      onCompleted({createProduct}) {
        // console.log('onCompleted', createProduct);
      },
      onError(error) {
        console.log('onError', error);
      }
    }
  );

  const serialNumber = randomString(8, UNAMBIGUOUS_ALPHANUMERIC);
  return (
    <div className="new-product">
      <div className="new-product-left">
        <form
          onSubmit={e => {
            e.preventDefault();
            createProduct({
              variables: { id: serialNumber },
              optimisticResponse: {
                __typename: 'Mutation',
                createProduct: {
                  id: serialNumber,
                  __typename: 'Product',
                  state: 'manufactured',
                  history: {
                    manufactured: moment().toISOString(),
                    inspected: null,
                    shipped: null,
                    stocked: null,
                    labeled: null,
                    sold: null          
                  }
                }
              },
              update: (proxy, { data: { createProduct }}) => {
                const data = proxy.readQuery({query: PRODUCTS_QUERY });
                proxy.writeQuery({query: PRODUCTS_QUERY, data: {
                  ...data,
                  products: [...data.products, createProduct]
                }});
              }
            });          
          }}
        >
          <button className="left" type="submit">Create new product</button>
        </form>
      </div>
      <div className="new-product-right">
        {mutationLoading && <div className="loader">Loading...</div>}
        {mutationError && <p>Error :( Please try again</p>}
      </div>
    </div>
  );
};
