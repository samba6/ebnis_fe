// tslint:disable-next-line:no-any
export const logger = async (prefix: string, tag: string, ...data: any) => {
  if (process.env.NODE_ENV === "development") {
    // tslint:disable-next-line:no-console
    console[prefix](
      "\n\n     =======logging starts======\n",
      tag,
      "\n",
      ...data,
      "\n     =======logging ends======\n"
    );
  }
};

export default logger;
